import React, {useState, useEffect} from "react";
import api from "../utils/api";
import styled, { keyframes, css } from "styled-components";
import barberChair from "../assets/barberChair.png"
import shopOpen from "../common/shopOpen";

const getWaitLevel = (waitTime) => {
  if (waitTime <= 10) return { level: 1, color: "#4CAF50", tagline: "Smooth Sailing. Walk Right In!" };
  if (waitTime <= 25) return { level: 2, color: "#FFC107", tagline: "Buzzin' a Little. Grab a Coffee!" };
  return { level: 3, color: "#F44336", tagline: "Packed House. Patience, Friend!" };
};


const Availability = () => {
  
  const{isOpen, barbers, waitTime } = shopOpen();

  const chairs = [barbers[0] || "", barbers[1] || ""];

  const { level, color, tagline } = isOpen
    ? getWaitLevel(waitTime)
    : { level: 0, color: "#fffaf6", tagline: "See You Soon!" };

  return (
      <AvailabityWrapper>
        <Section>
          <Title>AVAILABLE BARBERS</Title>
          <BarberWrapper>
            {chairs.map((name, idx) => (
              <BarberStack key={idx}>
                  <BarberImage src={barberChair} alt="Barber Chair" $active={isOpen && name !== ""} />
                    <BarberNameBox>{isOpen && name ? name : ""}</BarberNameBox>
                  </BarberStack>              
            ))}
          </BarberWrapper>
        </Section>

        <Divider />

        <Section>
            <WaitingTimeWrapper>
            <Title>WAITING LEV3<span className="flipped-l">L</span></Title>
          <WaitingLevelBox $color={color} $level={level}>
            {tagline}
          </WaitingLevelBox>
          </WaitingTimeWrapper>
        </Section>
      </AvailabityWrapper>
  );
};

export default Availability;

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

const pulseGreen = keyframes`
  0%, 100% { box-shadow: 0 0 5px #4CAF50; }
  50% { box-shadow: 0 0 15px #4CAF50; }
`;

const pulseYellowShake = keyframes`
  0%, 100% { box-shadow: 0 0 5px #FFC107; transform: translateX(0); }
  50% { box-shadow: 0 0 15px #FFC107; transform: translateX(3px); }
`;

const pulseRedBounce = keyframes`
  0%, 100% { box-shadow: 0 0 5px #F44336; transform: translateY(0); }
  50% { box-shadow: 0 0 20px #F44336; transform: translateY(-5px); }
`;

const AvailabityWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  text-align: center;
  width: 100%;
  background: black;
  font-family: 'Bebas Neue', sans-serif;
  color: white;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Section = styled.div`
  flex: 1;
  padding: 100px;

  @media (max-width: 768px) {
    padding: 20px 10px;
  }
`;

const Divider = styled.div`
  width: 2px;
  height: 32rem;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 20px;

  @media (max-width: 768px) {
    width: 100%;
    height: 4px;
    margin: 15px 0;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #fff0db;

  span.flipped-l {
    color: #fff0db;
  }
`;

const BarberWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  width: 100%;
`;

const BarberStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const BarberImage = styled.img`
  width: 150px;
  height: auto;
  ${({ $active }) =>
    $active &&
    css`
      animation: ${pulse} 2s infinite;
    `}

  @media (max-width: 768px) {
    width: 170px;
  }
`;


const BarberNameBox = styled.div`
  padding: 10px 18px;
  background: #fffaf6;
  color: #000;
  border-radius: 999px;
  font-size: 1.4rem;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
`;

const WaitingTimeWrapper = styled.div`
  @media (max-width: 768px) {
    padding-top: 0;
    padding-bottom: 70px;
  }
`;

const WaitingLevelBox = styled.div`
  margin-top: 70px;
  display: inline-block;
  padding: 20px 50px;
  font-size: 1.5rem;
  color: black;
  border-radius: 999px;
  background-color: ${({ $color }) => $color};
  box-shadow: 0 0 5px ${({ $color }) => $color};

  ${({ $level }) =>
    $level === 1 &&
    css`
      animation: ${pulseGreen} 2s infinite;
    `}
  ${({ $level }) =>
    $level === 2 &&
    css`
      animation: ${pulseYellowShake} 2s infinite;
    `}
  ${({ $level }) =>
    $level === 3 &&
    css`
      animation: ${pulseRedBounce} 2s infinite;
    `}

  @media (max-width: 768px) {
  margin-top: 30px;
}
`;