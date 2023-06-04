import React, {useCallback} from 'react';
import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Stack, useToast,
} from "@chakra-ui/react";
import {useUpsertDeviceMutation} from "../../../queries";

interface UpsertDrawerProps {
  originalDevice?: Device | null | undefined;
  onClose: () => void;
  isOpen: boolean;
}

export function UpsertDrawer(props: UpsertDrawerProps) {
  const {
    originalDevice,
    onClose,
    isOpen,
  } = props;

  const toast = useToast();

  const upsertDevice = useUpsertDeviceMutation({
    onError: (error) => {
      toast({
        title: 'Could not create device',
        description: (error as Error).message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  });

  const [device, setDevice] = React.useState(originalDevice);
  const idField = React.useRef(null);

  const setDeviceProperty = useCallback(<TKey extends keyof Device>(property: TKey, value: Device[TKey]) => {
    setDevice({
      ...(device ?? {} as Device),
      [property]: value,
    });
  }, [device, setDevice]);

  React.useEffect(() => {
    if (!originalDevice) {
      setDevice({
        PK: '',
        SK: '',
        id: undefined as unknown as number,
        type: '',
        device_health: '',
        price: 0,
        color: '',
        location: '',
        last_used: new Date(),
      } as Device)
      return;
    }

    setDevice(originalDevice);
  }, [originalDevice]);

  const formattedPrice = React.useMemo(() => {
    const priceFormatter = new Intl.NumberFormat('en-GB', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

    if (!device || device.price === 0) {
      return priceFormatter.format(0);
    }

    return priceFormatter.format((device.price));
  }, [device]);

  const onSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!device) {
      return;
    }

    upsertDevice.mutate(device);

    onClose();
  }, [device, upsertDevice, onClose]);

  if (!device) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      placement='right'
      initialFocusRef={idField}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}
            data-testid='upsert-drawer-form'
      >
        <DrawerOverlay/>
        <DrawerContent>
          <DrawerCloseButton/>
          <DrawerHeader borderBottomWidth='1px' data-testid='upsert-drawer-header'>
            {originalDevice ? `Edit ${originalDevice.type} #${device.id}` : 'Create new device'}
          </DrawerHeader>

          <DrawerBody>
            <Stack spacing='24px'>
              <Box>
                <FormLabel htmlFor='id'>id</FormLabel>
                <NumberInput
                  id='id'
                  ref={idField}
                  value={device.id ?? ''}
                  onChange={value => setDeviceProperty('id', Number(value))}
                >
                  <NumberInputField data-testid='upsert-drawer-id-input'
                                    required
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Box>
                <FormLabel htmlFor='type'>Type</FormLabel>
                <Select id='type'
                        value={device.type ?? ''}
                        onChange={(event) => setDeviceProperty('type', event.target.value)}
                        data-testid='upsert-drawer-type-input'
                        required
                >
                  {!device.type && (
                    <option disabled value=''>
                      -- please select --
                    </option>
                  )}
                  <option value='freezer'>
                    Freezer
                  </option>
                  <option value='cycler'>
                    Cycler
                  </option>
                  <option value='shaker'>
                    Shaker
                  </option>
                  <option value='pipette'>
                    Pipette
                  </option>
                  <option value='centrifuge'>
                    Centrifuge
                  </option>
                </Select>
              </Box>

              <Box>
                <FormLabel htmlFor='location'>Location</FormLabel>
                <Input
                  id='location'
                  value={device.location}
                  onChange={(event) => setDeviceProperty('location', event.target.value)}
                  data-testid='upsert-drawer-location-input'
                  required
                />
              </Box>

              <Box>
                <FormLabel htmlFor='health'>Health</FormLabel>
                <Select id='health'
                        value={device.device_health ?? ''}
                        onChange={(event) => setDeviceProperty('device_health', event.target.value)}
                        data-testid='upsert-drawer-health-input'
                        required
                >
                  {!device.device_health && (
                    <option disabled value=''>
                      -- please select --
                    </option>
                  )}
                  <option value='good'>
                    Good
                  </option>
                  <option value='mediocre'>
                    Mediocre
                  </option>
                  <option value='ok'>
                    Ok
                  </option>
                  <option value='bad'>
                    Bad
                  </option>
                  <option value='broken'>
                    Broken
                  </option>
                </Select>
              </Box>

              <Box>
                <FormLabel htmlFor='color'>Color</FormLabel>
                <Input
                  id='color'
                  value={device.color}
                  onChange={(event) => setDeviceProperty('color', event.target.value)}
                  type='color'
                  data-testid='upsert-drawer-color-input'
                  required
                />
              </Box>

              <Box>
                <FormLabel htmlFor='price'>Price</FormLabel>
                <NumberInput
                  id='price'
                  onChange={(valueString) => setDeviceProperty('price', Number(valueString))}
                  value={formattedPrice}
                >
                  <NumberInputField data-testid='upsert-drawer-price-input'
                                    required
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth='1px'>
            <Button variant='outline'
                    mr={3}
                    onClick={onClose}
                    data-testid='upsert-drawer-cancel-button'
            >
              Cancel
            </Button>
            <Button colorScheme='blue'
                    type='submit'
                    data-testid='upsert-drawer-save-button'
            >
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </form>
    </Drawer>
  );
}
