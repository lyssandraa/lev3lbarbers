import React from "react";
import styled from "styled-components";
import ServiceMenu from "../components/ServiceMenu";
import background from '../assets/servicesBackground.png';
import GallerySection from "../components/GallerySection";

const Services = () => {
  return (
    <PageWrapper>
      <ServiceMenu />
      {/* <Divider />  */}
    </PageWrapper>
  );
};

export default Services;

const PageWrapper = styled.div`
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 80vh;
  padding: 20px 20px;

  @media (max-width: 768px) {
  min-height: 90vh;
`;
// const Divider = styled.div`
//   width: 80%;
//   max-width: 800px;
//   height: 4px;
//   margin: 60px auto;
//   border-radius: 2px;
//   background: linear-gradient(
//     90deg,
//     rgba(15, 23, 42, 0) 0%,
//     rgba(15, 23, 42, 0.5) 50%,
//     rgba(15, 23, 42, 0) 100%
//   );
//   box-shadow: 0 0 8px rgba(15, 23, 42, 0.3);
// `;
