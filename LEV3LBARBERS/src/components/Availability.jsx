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

const Availability = () => {
  const barbers = ["Ari", ""];
  const isOpen = shopOpen();

  return (
    <GradientBackground id="availability">
      <AvailabityWrapper>
        <Section>
          <Title>AVAILABLE BARBERS</Title>
          <BarberWrapper>
            {barbers.map((name, idx) => (
              <BarberStack key={idx}>
                <StyledIcon
                  icon="mdi:chair-school"
                  $active={isOpen && name !== ""}
                />
                <BarberNameBox>{isOpen && name ? name : ""}</BarberNameBox>
              </BarberStack>
            ))}
          </BarberWrapper>
        </Section>

        <Divider />

        <Section>
            <WaitingTimeWrapper>
          <Title>WAITING TIME</Title>
          <WaitingTimeBox>
            {isOpen ? "15 min" : "See You Soon!"}
          </WaitingTimeBox>
          </WaitingTimeWrapper>
        </Section>
      </AvailabityWrapper>
    </GradientBackground>
  );
};

export default Availability;

const GradientBackground = styled.div`
  background: linear-gradient(to bottom, #0a0a0a, #ffffff);
  width: 100%;
  padding: 10px 0;
`;

const AvailabityWrapper = styled.div`
  font-family: 'Bebas Neue', sans-serif;
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  text-align: center;
  color: white;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Section = styled.div`
  flex: 1;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px 10px;
  }
`;

const WaitingTimeWrapper = styled.div`
    @media (max-width: 768px) {
        padding-top: 0;
        padding-bottom: 50px;
    }
`;

const Divider = styled.div`
  width: 2px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 20px;

  @media (max-width: 768px) {
    width: 100%;
    height: 4px;
    margin: 15px 0;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 10px;
  color: white;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
`;

const BarberWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
`;

const BarberStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const StyledIcon = styled('iconify-icon')`
  font-size: 100px;
  color: ${({ $active }) => ($active ? '#0f0' : '#fff')};
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
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.85);
  color: #000;
  border-radius: 999px;
  font-size: 1.4rem;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
`;

const WaitingTimeBox = styled.div`
  display: inline-block;
  padding: 16px 45px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  font-size: 1.8rem;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  margin-top: 0;
`;
