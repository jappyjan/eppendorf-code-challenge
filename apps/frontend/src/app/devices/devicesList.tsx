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

interface DeviceCardProps {
  device: Device;
}

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

function DeviceCard(props: DeviceCardProps) {
  const {device} = props;

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
      case 'broken':
        return 'red';

      case 'good':
        return 'green';

      case 'ok':
        return 'yellow';

      case 'mediocre':
        return 'orange';

      case 'bad':
        return 'black';

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
        <Text>The {device.type} is currently located at {device.location}.</Text>
        <Text>It was last used at the {formattedLastUseDate}</Text>
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

  if (devicesQuery.isError) {
    return (
      <Center>
        <Text>Could not load devices.</Text>
      </Center>
    )
  }

  return (
    <SimpleGrid spacing={4}
                minChildWidth='300px'
                maxWidth='100%'
    >
      {devicesQuery.data?.map((device) => <DeviceCard device={device} key={device.id}/>)}
      {!devicesQuery.isSuccess && (<>
        <SkeletonDeviceCard/>
        <SkeletonDeviceCard/>
        <SkeletonDeviceCard/>
        <SkeletonDeviceCard/>
      </>)}
    </SimpleGrid>
  )
}
