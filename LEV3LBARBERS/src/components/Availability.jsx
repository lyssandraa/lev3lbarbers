import React from "react";
import styled, { keyframes, css } from "styled-components";
import barberChair from "../assets/barberChair.png";
import shopOpen from "../common/shopOpen";

const WAIT_LEVELS = [
  { id: 1, color: "#7cbf7c", label: "Ready for You" },
  { id: 2, color: "#d4a048", label: "Clippers are Buzzing" },
  { id: 3, color: "#a74c4c", label: "Worth the Wait" },
];

const getWaitLevel = (waitTime) => {
  if (waitTime <= 10) return 1;
  if (waitTime <= 25) return 2;
  return 3;
};

const Availability = () => {
  const { isOpen, barbers, waitTime } = shopOpen();
  const topChairs    = [barbers[0] || "", barbers[1] || ""];
  const bottomChair  = barbers[2] || "";
  const level = isOpen ? getWaitLevel(waitTime) : 0;

  return (
      <Wrapper>
        <GradientBackground id="availability">
        <SectionDivider />
        <Section>
          <Title>AVAILABLE BARBERS</Title>
          <BarberTriangle>
            {/* Top row — two chairs */}
            <BarberRow>
              {topChairs.map((name, idx) => (
                <BarberStack key={idx}>
                  <BarberImage
                    src={barberChair}
                    alt="Barber Chair"
                    $active={isOpen && !!name}
                  />
                  <BarberNameBox>{isOpen && name}</BarberNameBox>
                </BarberStack>
              ))}
            </BarberRow>
            {/* Bottom row — one chair centred */}
            <BarberRow>
              <BarberStack>
                <BarberImage
                  src={barberChair}
                  alt="Barber Chair"
                  $active={isOpen && !!bottomChair}
                />
                <BarberNameBox>{isOpen && bottomChair}</BarberNameBox>
              </BarberStack>
            </BarberRow>
          </BarberTriangle>
        </Section>

        <SectionDivider />

        <Section>
          <WaitingTimeWrapper>
            <Title>
              WAITING LEV3L
            </Title>
            <LevelsWrapper>
              {WAIT_LEVELS.map(({ id, color, label }) => (
                <LevelBox key={id} color={color} active={level === id}>
                  {label}
                </LevelBox>
              ))}
            </LevelsWrapper>
          </WaitingTimeWrapper>
        </Section>
        </GradientBackground>
      </Wrapper>
    
  );
};

export default Availability;


const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(212,169,104,0.7); }
  70%  { box-shadow: 0 0 10px 10px rgba(212,169,104,0); }
  100% { box-shadow: 0 0 0 0 rgba(212,169,104,0); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.2); transform: scale(1); }
  50%      { box-shadow: 0 0 20px currentColor; transform: scale(1.05); }
`;

const Wrapper = styled.div`
  font-family: "Bebas Neue", sans-serif;
  display: flex;
  flex-direction: row;
  justify-content: center;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  color: white;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const GradientBackground = styled.div`
  background: #111111;
  border-top: 1px solid rgba(200, 168, 96, 0.2);
  width: 100%;
  padding: 10px 0;
`;

const Section = styled.div`
  flex: 1;
  padding: 50px;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const SectionDivider = styled.div`
  width: 80%;
  height: 2px;
  margin: 1rem auto;
  background: linear-gradient(to right, transparent, #d4a968, transparent);
  border-radius: 2px;
`;

const Title = styled.h2`
  margin-bottom: 30px;
  font-family: "Bebas Neue", sans-serif;
  font-size: 2.1rem;
  letter-spacing: 1px;
  color: #f5f2ed;

  span.invertedL {
    display: inline-block;
    transform: scaleX(-1);
  }
`;

const BarberTriangle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const BarberRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
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
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(212, 169, 104, 0.6);

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
  padding: 0.5rem 1.5rem;
  margin-bottom: 2rem;
  background: #2b2b2b;
  color: #f5f2ed;
  border-radius: 999px;
  font-size: 1.4rem;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: #d4a968;
    color: #2b2b2b;
  }
`;

const WaitingTimeWrapper = styled.div`
  @media (max-width: 768px) {
    padding-bottom: 50px;
  }
`;

const LevelsWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
`;

const LevelBox = styled.div`
  padding: 15px 25px;
  border-radius: 999px;
  font-size: 1.2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  color: ${({ active }) => (active ? "#000" : "#ccc")};
  background: ${({ color, active }) =>
    active ? color : "rgba(255,255,255,0.05)"};
  border: 1px solid ${({ color }) => color};

  ${({ active }) =>
    active &&
    css`
      animation: ${pulseGlow} 2.5s infinite;
    `}

  &:hover {
    transform: scale(1.03);
  }
`;
