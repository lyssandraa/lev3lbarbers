import React from "react";
import styled from "styled-components";

const servicesList = [
    { name: "Adult Haircut", price: "£13" },
    { name: "Kids Haircut", price: "£11" },
    { name: "Scissors Haircut", price: "£15" },
    { name: "LEV3L Skin Fade", price: "£15" },
    { name: "Steam Shave", price: "£15" },
    { name: "Hot Towel Shave", price: "£15" },
    { name: "Beard Trim & Shape", price: "£13" },
    { name: "O.A.P", price: "£11" },
    { name: "Face Mask", price: "£7" },
    { name: "Nose Wax", price: "£2" },
    { name: "Facial Threading", price: "£8" },
    { name: "Pattern & Design", price: "£5" },
  ];
  
  const PriceMenu = () => {
    return (
      <SectionWrapper>
        <MenuTitle>Our Services</MenuTitle>
        <MenuCard>
          <ServiceList>
            {servicesList.map((service, index) => (
              <ServiceItem key={index}>
                <span>{service.name}</span>
              </ServiceItem>
            ))}
          </ServiceList>
          <ExtraInfo>
            We cater to <strong>all hair types</strong>, including <strong>afro, curly, straight</strong>, and more.<br />
            Other services may also be available <strong>upon request</strong>.
          </ExtraInfo>
        </MenuCard>
      </SectionWrapper>
    );
  };
  
  export default PriceMenu;
  
  
  const SectionWrapper = styled.section`
  min-height: 90vh;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
  min-height: 100vh;
}
`;

const MenuTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.8rem;
  font-weight: 500;
  text-align: center;
  letter-spacing: 1px;
  margin-bottom: 50px;
  margin-top: 80px;
  background: linear-gradient(
    20deg,
    #a07400 0%,
    #c89300 20%,
    #ffd700 40%,
    #fff8c0 50%,
    #ffcc00 60%,
    #c89300 80%,
    #a07400 100%
  );
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
  margin-top: 40px;
  margin-bottom: 20px;
`;

const MenuCard = styled.div`
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 18px;
  padding: 10px 30px;
  max-width: 700px;
  width: 100%;
  color: #c99a32;
  border: 1px solid rgba(201,145,50, 0.6);
  box-shadow: 0 0 12px rgba(201, 154, 50, 0.08);

  @media (max-width: 768px) {
  max-width: 600px;
`;

const ServiceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ServiceItem = styled.li`
  font-family: 'Bebas Neue', sans-serif;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  font-size: 1.4rem;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(201,145,50, 0.3);

  &:last-child {
    border-bottom: none;
  }

  span {
    color: #fffaf6;
  }
`;

const ExtraInfo = styled.p`
  margin-top: 20px;
  font-size: 1.3rem;
  text-align: center;
  color: #fffaf6;
  line-height: 1.6;
  font-family: 'Bebas Neue', sans-serif;

  strong {
    color: #c99a32;
  }
`;