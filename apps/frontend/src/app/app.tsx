import {Heading, Spacer, HStack, Box, Button} from "@chakra-ui/react";
import {DevicesList} from "./devices/devicesList";
import {useQueryClient} from "react-query";
import {UpsertDrawer} from "./devices/create/upsert-drawer";
import React from "react";

export function App() {
  const queryClient = useQueryClient();

  const [showUpsertDrawer, setShowUpsertDrawer] = React.useState(false);

  return (
    <Box padding='1rem'>
      <nav>
        <HStack>
          <Heading>Eppendorf</Heading>
          <Spacer/>
          <Button onClick={() => setShowUpsertDrawer(true)}>+</Button>
          <Button onClick={() => queryClient.refetchQueries()}>Refresh</Button>
        </HStack>
      </nav>

      <UpsertDrawer onClose={() => setShowUpsertDrawer(false)} isOpen={showUpsertDrawer}/>

      <Box mt='5rem'>
        <DevicesList/>
      </Box>
    </Box>
  );
}

export default App;
