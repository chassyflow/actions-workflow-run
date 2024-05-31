import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken = process.env.CHASSY_TOKEN
    const userDefinedParameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )
    console.log('process.env.API_BASE_URL - ', process.env.API_BASE_URL)

    if (!chassyToken) {
      throw new Error('Chassy token isn`t present in env variables')
    }
    const workflowRunURL = `${process.env.API_BASE_URL}/workflow/${workflowId}/run`
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
            githubContext: { ...github.context, ...userDefinedParameters }
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
