const { spawn } = require('cross-spawn');
const fs = require('fs');
require('dotenv').config();
const Debugger = require('./debugger');
const Tail = require('tail').Tail;

/*
    This script is used to watch for file changes in the project and trigger a build and copy the webpacked file to the Desktop Node runtime folder.
    It also tails the logs for messages containing a keyword specified in the .env file.
    Example Usage:
    - Add the following to your package.json file:
        "scripts": {
            "prod-debug": "node prod-debug.js"
        }
    - Create a .env file in the root of the project with the following content:
        WEBPACKED_FILE_PATH=dist/hello-world.js
        DESTINATION_PATH=/_some_CID_task_file_name_.js
        LOG_PATH=/logs/_some_Task_ID_.log
        KEYWORD=DEBUG
        NODE_DIR=/path/to/node/dir/
    - Run the script using the command: npm run prod-debug
    - Change a file in the project and see the script trigger a build and copy the file to the Desktop Node runtime folder
    - Check the logs from the desktop node that contain your keyword
*/

const startWatching = async () => {
  console.log('Watching for file changes...');
  // watch and trigger builds
  await build();
};

/* build and webpack the task */
const build = async () => {
  console.log('Building...');
  const child = await spawn('npm', ['run', 'webpack:test'], {
    stdio: 'inherit',
  });

  await child.on('close', code => {
    if (code !== 0) {
      console.error('Build failed');
    } else {
      console.log('Build successful');
      copyWebpackedFile();
    }
    return;
  });
};

/* copy the task to the Desktop Node runtime folder */
const copyWebpackedFile = async () => {
  const debugConfig = await Debugger.getConfig();
  console.log('debugConfig', debugConfig);
  const nodeDIR = debugConfig.nodeDir;
  const sourcePath = __dirname + '/' + debugConfig.webpackedFilePath;
  const desktopNodeExecutablePath = nodeDIR + '/' + debugConfig.destinationPath;
  const desktopNodeLogPath = nodeDIR + '/' + debugConfig.logPath;
  const keyword = debugConfig.keyword;
  const taskID = debugConfig.taskID;

  if (!sourcePath || !desktopNodeExecutablePath) {
    console.error('Source path or destination path not specified in .env');
    return;
  }

  console.log(
    `Copying webpacked file from ${sourcePath} to ${desktopNodeExecutablePath}...`,
  );

  fs.copyFile(sourcePath, desktopNodeExecutablePath, async err => {
    if (err) {
      console.error('Error copying file:', err);
    } else {
      console.log('File copied successfully');
      tailLogs(desktopNodeLogPath, keyword, taskID);
    }
  });
};

/* tail logs */
const tailLogs = async (desktopNodeLogPath, keyword, taskID) => {
  console.log(`Watching logs for messages containing '${keyword}'`);

  // Ensure the log file exists, or create it if it doesn't
  try {
    await fs.promises.access(desktopNodeLogPath, fs.constants.F_OK);
  } catch (err) {
    console.log(`Log file not found, creating ${desktopNodeLogPath}`);
    await fs.promises.writeFile(desktopNodeLogPath, '', { flag: 'a' }); // 'a' flag ensures the file is created if it doesn't exist and not overwritten if it exists
  }

  let tail = new Tail(desktopNodeLogPath, '\n', {}, true);

  console.warn(
    `Now watching logs for messages containing '${keyword}'. Please start the Task ${taskID} and keep it running on the Desktop Node.`,
  );

  tail.on('line', function (data) {
    console.log(data);
    // if (keywords.some(keyword => data.includes(keyword))) {
    //   console.log(`PROD$ ${data}`);
    // }
  });

  tail.on('error', function (error) {
    console.log('ERROR: ', error);
  });
};

startWatching();
