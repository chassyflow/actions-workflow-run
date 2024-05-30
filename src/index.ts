/**
 * The entrypoint for the action.
 */
import { config } from 'dotenv'
import { run } from './main'

config()

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
