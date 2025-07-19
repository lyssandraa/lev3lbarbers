import React from "react";
import styled from "styled-components";

const servicesList = [
    { name: "Adult Haircut", price: "£13" },
    { name: "Kids Haircut", price: "£11" },
    { name: "Haircut & Beard Trim", price: "£23" },
    { name: "LEV3L Skin Fade", price: "£13" },
    { name: "Hot Towel Shave", price: "£15" },
    { name: "Steam Shave", price: "£15" },
    { name: "Hot Towel & Steam Shave", price: "£21" },
    { name: "O.A.P", price: "£11" },
    { name: "Scissor Cut", price: "£15" },
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
                <span>{service.price}</span>
              </ServiceItem>
            ))}
          </ServiceList>
        </MenuCard>
      </SectionWrapper>
    );
  };
  
  export default PriceMenu;
  
  
  const SectionWrapper = styled.section`
    min-height: 90vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;
  
  const MenuTitle = styled.h2`
    font-family: 'Dancing Script', cursive;
    font-size: 2.8rem;
    text-align: center;
    letter-spacing: 1px;
    margin-bottom: 25px;
    color: #f2f2f2;
    text-shadow:
      0 0 5px rgba(96, 165, 250, 0.4),
      0 0 10px rgba(96, 165, 250, 0.3);
  `;
  
  const MenuCard = styled.div`
    background: rgba(36, 39, 56, 0.85);
    backdrop-filter: blur(6px);
    border-radius: 18px;
    padding: 5px 30px;
    max-width: 600px;
    width: 100%;
    color: #e5e7eb;
    box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.05);
  `;
  
  const ServiceList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
  `;
  
  const ServiceItem = styled.li`
    font-family: 'Bebas Neue', sans-serif;
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    font-size: 1.2rem;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
    &:last-child {
      border-bottom: none;
    }
  
    span {
      color: #f1f5f9;
    }
  `;
  