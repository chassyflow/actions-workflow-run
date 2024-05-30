import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken: string = core.getInput('chassyToken')
    const parameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )

    console.log('workflowId', workflowId)
    console.log('chassyToken', chassyToken)
    console.log('parameters', parameters)
    console.log('github.context', github.context)
    // Set outputs for other workflow steps to use
    core.setOutput('workflowExecution', 'workflowExecution will be here')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
