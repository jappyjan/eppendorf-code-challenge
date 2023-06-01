import {ChakraProvider} from "./providers/chakra.provider";
import {Center, Heading, Spacer, HStack, Container} from "@chakra-ui/react";

export function App() {
  return (
    <ChakraProvider>
      <Container paddingInline="2rem" paddingBlock="1rem">
        <nav>
          <HStack>
            <Heading>Eppendorf</Heading>
            <Spacer/>
            <ul></ul>
          </HStack>
        </nav>
        <Center h="100vh">
          <Heading>Hello World</Heading>
        </Center>
      </Container>
    </ChakraProvider>
  );
}

export default App;
