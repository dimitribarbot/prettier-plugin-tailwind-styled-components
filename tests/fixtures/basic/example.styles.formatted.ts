import tw from "tailwind-styled-components";
import styled from "styled-components";

const StyledComponentContainer = styled.section`
  background-color: #0366d6;
  color: #012552;
`;

const Container = tw.div`
  h-32
  lg:h-72
`;

export const ContainerB = tw(Container)`
  flex
  flex-col
  text-lg
`;

export const ContainerC = tw(Container)<{ $active: boolean }>`
  flex
  flex-col
  text-lg
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
  lg:w-96
  ${() => fixedComponentCss}
  max-w-xs
`;

export const ContainerH = tw.div``;

export const ContainerI = tw.div`
  ${() => fixedComponentCss}
  flex
  flex-row
`;

export const ContainerJ = tw.div`
  ${() => fixedComponentCss}
  flex
  flex-col
`;

export const ContainerK = tw(StyledComponentContainer)`
  flex
  flex-col
`;
