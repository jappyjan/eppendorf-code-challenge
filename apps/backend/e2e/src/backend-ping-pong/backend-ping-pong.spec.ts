import { execSync } from 'child_process';
import { join } from 'path';

describe('CLI tests', () => {
  it('should print a message', () => {
    const cliPath = join(process.cwd(), 'dist/apps/backend/ping-pong');
    const eventPath = join(process.cwd(), '/apps/backend/e2e/src/backend-ping-pong/backend-ping-pong.event.json');

    const output = execSync(`run-local-lambda --file ${cliPath} --event ${eventPath} --timeout 3`).toString();

    expect(output).toMatch(JSON.stringify({statusCode: 200, body: 'pong'}));
  });
});
