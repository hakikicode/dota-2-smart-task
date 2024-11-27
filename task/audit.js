const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const { auditSubmission } = require('../editTask.js');

class Audit {
  /**
   * Validates the submission value by your logic
   *
   * @param {string} submission_value - The submission value to be validated
   * @param {number} round - The current round number
   * @returns {Promise<boolean>} The validation result, return true if the submission is correct, false otherwise
   */
  async validateNode(submission_value, round) {
    console.log(`VALIDATE NODE FOR ROUND ${round}`);
    return await auditSubmission(submission_value, round);
  }
  /**
   * Vote on the other nodes Submissions
   *
   * @param {number} roundNumber - The current round number
   * @returns {void}
   */
  async auditTask(roundNumber) {
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode,
      roundNumber,
    );
  }
}
const audit = new Audit();
module.exports = { audit };
