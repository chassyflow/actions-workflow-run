import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken = process.env.CHASSY_TOKEN
    // const parameters: Record<string, unknown> = JSON.parse(
    //   core.getInput('parameters') || '{}'
    // )

    if (!chassyToken) {
      throw new Error('Chassy token isn`t present in env variables')
    }

    const workflowRunURL = `https://api.test.chassy.dev/v1/workflow/${workflowId}/run`
    let response
    try {
      const rawResponse = await fetch(workflowRunURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chassyToken}`
        },
        body: JSON.stringify({
          githubData: {
            envContext: process.env,
            githubContext: github.context
          },
          dryRun: true
        })
      })
      if (!rawResponse.ok) {
        throw new Error(`Network response was not ok ${rawResponse.statusText}`)
      }
      response = await rawResponse.json()
    } catch (e) {
      console.debug(`Error during making POST request to ${workflowRunURL}`)
      if (e instanceof Error) throw new Error(e.message)
    }

    core.setOutput('workflowExecution', JSON.stringify(response))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
