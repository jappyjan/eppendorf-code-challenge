import {Heading, Spacer, HStack, Box, Button} from "@chakra-ui/react";
import {DevicesList} from "./devices/devicesList";
import {useQueryClient} from "react-query";

export function App() {
  const queryClient = useQueryClient();

  return (
    <Box padding='1rem'>
      <nav>
        <HStack>
          <Heading>Eppendorf</Heading>
          <Spacer/>
          <Button onClick={() => queryClient.refetchQueries()}>Refresh</Button>
        </HStack>
      </nav>

      <Box mt='5rem'>
        <DevicesList/>
      </Box>
    </Box>
  );
}

export default App;
