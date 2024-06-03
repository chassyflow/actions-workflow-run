import * as core from '@actions/core'
import * as github from '@actions/github'
import jq from 'node-jq'

const BACKEND_BASE_URLS_BY_ENV: Record<string, string> = {
  PROD: 'https://api.chassy.io/v1',
  STAGE: 'https://api.stage.chassy.dev/v1',
  DEV: 'https://api.test.chassy.dev/v1'
}

export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken = process.env.CHASSY_TOKEN
    const userDefinedParameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )
    const apiBaseUrl =
      BACKEND_BASE_URLS_BY_ENV[core.getInput('backendEnvironment')] ||
      BACKEND_BASE_URLS_BY_ENV['PROD']

    if (!chassyToken) {
      throw new Error('Chassy token isn`t present in env variables')
    }

    const workflowRunURL = `${apiBaseUrl}/workflow/${workflowId}/run`
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
            // spread github.context object after userDefinedParameters for preventing
            // user from rewriting github specific fields
            githubContext: { ...userDefinedParameters, ...github.context }
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

    // const formattedOutput = await jq.run('.', JSON.stringify(response), {
    //   input: 'string',
    //   output: 'json'
    // })
    core.setOutput('workflowExecution', JSON.stringify(response))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
