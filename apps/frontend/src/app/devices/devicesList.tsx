import {useDevices} from "../../queries";
import React, {useMemo} from "react";
import {
  Avatar,
  Card,
  CardBody,
  CardFooter,
  CardHeader, Center,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Tag,
  Text,
  VStack
} from "@chakra-ui/react";
import {Device} from "@eppendorf-coding-challenge/data-interfaces";
import {UpsertDrawer} from "./upsert/upsert-drawer";

function SkeletonDeviceCard() {
  return (
    <Card align='center'
          variant='outline'
          maxWidth='400px'
          data-testid='skeleton-device-card'
    >
      <CardHeader>
        <HStack>
          <SkeletonCircle size='3rem'/>
          <VStack align='left'>
            <Skeleton height='2rem' width='5rem'/>
            <Skeleton height='1rem' width='3rem'/>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <Skeleton height='1rem' width='20rem' marginBlock='.2rem'/>
        <Skeleton height='1rem' width='17rem' marginBlock='.2rem'/>
        <Skeleton height='1rem' width='19rem' marginBlock='.2rem'/>
      </CardBody>
      <CardFooter>
        <Skeleton height='1rem' width='3rem'/>
      </CardFooter>
    </Card>
  )
}

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
}
function DeviceCard(props: DeviceCardProps) {
  const {
    device,
    onClick,
  } = props;

  const formattedLastUseDate = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return dateFormatter.format(device.last_used);
  }, [device.last_used]);

  const deviceHealthTagColorScheme = useMemo(() => {
    switch (device.device_health) {
      case 'good':
        return 'green';

      case 'ok':
        return 'yellow';

      case 'mediocre':
        return 'orange';

      case 'bad':
        return 'pink';

      case 'broken':
        return 'red';

      default:
        return undefined;
    }
  }, [device.device_health]);

  const [isFocused, setIsFocused] = React.useState(false);

  const formattedPrice = useMemo(() => {
    const formatter = Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(device.price);
  }, [device.price]);

  return (
    <Card align='center'
          variant='filled'
          backgroundColor={isFocused ? 'blue.100' : undefined}
          onMouseOver={() => setIsFocused(true)}
          onFocus={() => setIsFocused(true)}
          onMouseLeave={() => setIsFocused(false)}
          onBlur={() => setIsFocused(false)}
          cursor='pointer'
          maxWidth='400px'
          data-testid='device-card'
          onClick={onClick}
    >
      <CardHeader>
        <HStack>
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <Avatar bg={device.color} size='md' icon={<></>}/>
          <VStack align='left'>
            <Heading size='lg'>{device.type}</Heading>
            <Text>ID: {device.id}</Text>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <Text>The {device.type} is currently located at <b>{device.location}</b>.</Text>
        <Text>It was last used at the <b>{formattedLastUseDate}</b></Text>
      </CardBody>
      <CardFooter width='100%'>
        <HStack width='100%'>
          <Tag colorScheme={deviceHealthTagColorScheme}>{device.device_health}</Tag>
          <Spacer/>
          <Text>Price: {formattedPrice}</Text>
        </HStack>
      </CardFooter>
    </Card>
  )
}

export function DevicesList() {
  const devicesQuery = useDevices();

  const [showUpsertDrawer, setShowUpsertDrawer] = React.useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<Device['id'] | undefined>(undefined);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) {
      return undefined;
    }

    return devicesQuery.data?.find((device) => device.id === selectedDeviceId);
  }, [devicesQuery.data, selectedDeviceId]);

  const onDeviceCardClick = React.useCallback((deviceId: Device['id']) => {
    setSelectedDeviceId(deviceId);
    setShowUpsertDrawer(true);
  }, []);

  if (devicesQuery.isError) {
    return (
      <Center>
        <Text>Could not load devices.</Text>
      </Center>
    )
  }

  return (
    <>
      <UpsertDrawer originalDevice={selectedDevice}
                    onClose={() => setShowUpsertDrawer(false)}
                    isOpen={showUpsertDrawer}
      />
      <SimpleGrid spacing={4}
                  minChildWidth='300px'
                  maxWidth='100%'
      >
        {devicesQuery.data?.map((device) => (
          <DeviceCard device={device}
                      key={device.id}
                      onClick={() => onDeviceCardClick(device.id)}
          />
        ))}
        {!devicesQuery.isSuccess && (<>
          <SkeletonDeviceCard/>
          <SkeletonDeviceCard/>
          <SkeletonDeviceCard/>
          <SkeletonDeviceCard/>
        </>)}
      </SimpleGrid>
    </>
  )
}
