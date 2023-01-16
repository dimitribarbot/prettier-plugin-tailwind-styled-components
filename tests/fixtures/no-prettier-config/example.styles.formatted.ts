import tw from "tailwind-styled-components";

const Container = tw.div`
  h-32
  lg:h-72
`;

export const ContainerB = tw(Container)`
  text-lg
`;

export const ContainerC = tw(Container)<{ $active: boolean }>`
  flex
`;

export const ContainerD = tw.div`
  h-32
  lg:h-72
`;

export const ContainerE = tw.div`
  h-24
  lg:h-48
`;

const fixedComponentCss = `
  border
  border-primary-300
`;

export const ContainerF = tw.div`
  ${() => fixedComponentCss}
  w-80
  max-w-xs
  lg:w-96
`;

export const ContainerG = tw.div`
  w-80
  max-w-xs
  ${() => fixedComponentCss}
  lg:w-96
`;

export const ContainerH = tw.div``;
