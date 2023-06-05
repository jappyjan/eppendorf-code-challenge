import {Button, useToast} from "@chakra-ui/react";
import React, {MouseEventHandler} from "react";
import {jsonDeviceToModel, useUpsertDeviceMutation} from "../../../queries";
import {ButtonProps} from "@chakra-ui/button/dist/button";

async function getFile(accept: string): Promise<File> {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = accept;
  return await new Promise<File>((resolve, reject) => {
    fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        return reject(new Error('No file selected'));
      }

      resolve(files[0]);
    });

    fileInput.addEventListener('abort', reject);

    fileInput.click();
  });
}

export function UpsertFileButton(props: ButtonProps) {
  const upsertDeviceMutation = useUpsertDeviceMutation();
  const toast = useToast();

  const onClick: MouseEventHandler<HTMLButtonElement> = React.useCallback(async (e) => {
    if (props.onClick) {
      props.onClick(e);
    }

    const loadingToastId = toast({
      title: 'Importing file...',
      description: 'Please wait until the file is imported',
      status: 'loading',
      isClosable: false,
      duration: Infinity,
    });

    const file = await getFile('.json');

    // read file and parse it
    const reader = new FileReader();
    const fileContent = await new Promise((resolve, reject) => {
      reader.addEventListener('load', () => resolve(reader.result));
      reader.addEventListener('error', reject);
      reader.readAsText(file);
    });

    const parsedFile = JSON.parse(fileContent as string);

    if (!Array.isArray(parsedFile)) {
      throw new Error('Invalid file format');
    }

    try {
      const deviceDataObjects = parsedFile.map((deviceData) => {
        return jsonDeviceToModel(deviceData);
      });

      const batches = [];
      for (let i = 0; i < deviceDataObjects.length; i += 100) {
        batches.push(deviceDataObjects.slice(i, i + 100));
      }

      const results: PromiseSettledResult<unknown>[] = [];
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(batch.map((device) => {
          return new Promise((resolve, reject) => upsertDeviceMutation.mutate(device, {
            onSuccess: resolve,
            onError: reject,
          }));
        }));
        results.push(...batchResults);
      }

      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length > 0) {
        toast({
          title: 'File import failed',
          description: `${failed.length} devices failed to import`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      toast.close(loadingToastId);

      toast({
        title: 'File import successful',
        description: `Successfully imported ${parsedFile.length} devices`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: 'File import failed',
        description: (e as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [upsertDeviceMutation, toast]);

  return (
    <Button
      {...props}
      onClick={onClick}
    >
      {props.children}
    </Button>
  );
}
