import { execSync } from 'child_process';
import { join } from 'path';

describe('/devices', () => {
  describe('GET', () => {
    const lambdaHandlerPath = join(process.cwd(), 'dist/apps/backend/devices/list');
    const eventPath = join(__dirname, 'backend-devices-list.event.json');

    it('should return an array of devices stored in DynamoDB', () => {
      const dbScanMock = jest.fn();
      const output = execSync(`run-local-lambda --file ${lambdaHandlerPath} --event ${eventPath} --timeout 10`).toString();
      expect(output).toEqual('');
      const outputData = JSON.parse(output);

      expect(outputData).toBeInstanceOf(Array);
      expect(dbScanMock).toHaveBeenCalledWith({});
    });
  });
});
