import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {Button} from "@chakra-ui/react";
import {useDeleteDeviceMutation} from "../../../queries";
import React from "react";

interface DeleteButtonProps {
  device: Device;
  onDelete: () => void;
}

export function DeleteButton(props: DeleteButtonProps) {
  const {device, onDelete} = props;

  const deleteMutation = useDeleteDeviceMutation();

  const onClickDelete = React.useCallback(async () => {
    await deleteMutation.mutate(device);
    onDelete();
  }, [device, deleteMutation, onDelete]);

  return (
    <Button
      colorScheme="red"
      onClick={onClickDelete}
      variant="ghost"
    >
      Delete
    </Button>
  );
}
