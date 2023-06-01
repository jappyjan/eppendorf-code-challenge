import { ChakraBaseProvider, extendBaseTheme } from '@chakra-ui/react'
import chakraTheme from '@chakra-ui/theme'
import React from "react";

const { Button } = chakraTheme.components

const theme = extendBaseTheme({
  components: {
    Button,
  },
});

interface Props {
  children: React.ReactNode;
}

export function ChakraProvider({ children }: Props) {
  return (
    <ChakraBaseProvider theme={theme}>
      {children}
    </ChakraBaseProvider>
  );
}
