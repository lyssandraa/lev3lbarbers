import React from "react";
import styled, { keyframes, css } from "styled-components";
import 'iconify-icon';
import shopOpen from "../common/shopOpen";

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 10px 10px rgba(0, 255, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
  }
`;

const Availability = () =>{
    const barbers = ["Ari", ""];

    const isOpen = shopOpen();

    return (
    <AvailabityWrapper>
      <AvailableBarbers>
        <Title>AVAILABLE BARBERS</Title>
        <BarberWrapper>
          {barbers.map((name, idx) => (
            <BarberStack key={idx}>
              <StyledIcon
                icon="mdi:chair-school"
                $active={isOpen && name !== ""}
              />
              <BarberNameBox>
                {isOpen && name ? name : ""}
              </BarberNameBox>
            </BarberStack>
          ))}
        </BarberWrapper>
      </AvailableBarbers>
      <WaitingTime>
        <Title>WAITING TIME</Title>
        <WaitingTimeBox>{isOpen ? "15 min" : "See You Soon!"}</WaitingTimeBox>
      </WaitingTime>
    </AvailabityWrapper>
    );
};

export default Availability;

const AvailabityWrapper = styled.div`
    font-family: 'Bebas Neue', sans-serif;
    display: flex;
    flex-direction: row;
    width: 100%;
    text-align: center;

    & > div {
        padding: 40px;
    }

    @media (max-width: 768px) {
    flex-direction: column;

    & > div {
      padding: 30px;
    }
  }
`;

const AvailableBarbers = styled.div`
    background: #000;
    color: white;
    flex: 1;
`;

const BarberWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
`;

const BarberStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0;
    margin: 0;
`;

const StyledIcon = styled('iconify-icon')`
    font-size: 100px;
    color: ${({ $active }) => ($active ? '#0f0' : 'white')};
    ${({ $active }) =>
      $active &&
      css`
        animation: ${pulse} 2s infinite;
      `}

    @media (max-width: 768px) {
    font-size: 70px; 
  }
`;

const BarberNameBox = styled.div`
  background: #f2f2f2;
  color: ${({ children }) => (children ? '#000' : 'transparent')};
  padding: 15px;
  border-radius: 8px;
  font-size: 1.5rem;
  min-width: 100px;
  text-align: center;
  height: 48px; 
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WaitingTime = styled.div`
    flex: 1;
    border-top: 3px solid black;
    border-right: 3px solid black;
    background-color: #f2f2f2;

    @media (max-width: 768px) {
    background-color: #000;
    color: #fff;
    border-top: 2px solid #fff;
    }
`;

const WaitingTimeBox = styled.div`
    margin-top: 20px;
    background-color: #000;
    color: white;
    padding: 20px;
    font-size: 1.7rem;
    text-align: center;
    border-radius: 12px;
    width: 70%;
    margin-left: auto;
    margin-right: auto;

    @media (max-width: 768px) {
    width: 100%;
    background-color: #fff;
    color: #000;
  }
`;
