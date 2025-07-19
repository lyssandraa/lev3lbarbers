import React from "react";
import styled from "styled-components";
import PriceMenu from "../components/PriceMenu";
import GallerySection from "../components/GallerySection";

const Services = () => {
  return (
    <PageWrapper>
      <PriceMenu />
      {/* <Divider />  */}
    </PageWrapper>
  );
};

export default Services;

const PageWrapper = styled.div`
  background: linear-gradient(
    180deg,
    #020617 0%,
    #0f172a 40%,
    #e0e7ff 90%
  );
  min-height: 100vh;
  padding: 20px 20px;
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
