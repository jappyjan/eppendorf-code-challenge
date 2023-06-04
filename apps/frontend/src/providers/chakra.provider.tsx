import {ChakraBaseProvider, extendBaseTheme} from '@chakra-ui/react'
import chakraTheme from '@chakra-ui/theme'
import React from "react";

const theme = extendBaseTheme({
  components: chakraTheme.components,
});

interface Props {
  children: React.ReactNode;
}

export function ChakraProvider({children}: Props) {
  return (
    <ChakraBaseProvider theme={theme}>
      {children}
    </ChakraBaseProvider>
  );
}
