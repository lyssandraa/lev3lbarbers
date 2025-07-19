import React from "react";
import styled from "styled-components";

const GallerySection = () => {
  return (
    <SectionWrapper>
      <SectionTitle>Customer Gallery</SectionTitle>
      <GalleryGrid>
        {Array.from({ length: 3 }).map((_, index) => (
          <GalleryItem key={index}>
            <Placeholder>Image {index + 1}</Placeholder>
          </GalleryItem>
        ))}
      </GalleryGrid>
    </SectionWrapper>
  );
};

export default GallerySection;


const SectionWrapper = styled.section`
  padding: 20px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;


const SectionTitle = styled.h2`
  font-family: 'Dancing Script', cursive;
  font-size: 2.8rem;
  color: #f5f5f5;
  margin-bottom: 40px;
  text-shadow:
    0 0 6px rgba(30, 70, 150, 0.6),
    0 0 12px rgba(30, 70, 150, 0.4);
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
  width: 100%;
  max-width: 1000px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablets/smaller screens */
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* 1 column on very small/mobile screens */
  }
`;

const GalleryItem = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.03);
  }

  &:hover div {
    box-shadow: 0 0 12px rgba(255, 0, 0, 0.4);
  }
`;

const Placeholder = styled.div`
  background-color: #1e293b;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #94a3b8;
  font-size: 1.1rem;
  font-family: 'Bebas Neue', sans-serif;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.05);
  transition: box-shadow 0.3s ease;
`;

