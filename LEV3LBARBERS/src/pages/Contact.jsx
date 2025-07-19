import React from "react";
import styled from "styled-components";

const ContactPage = () => {
  return (
    <PageWrapper>
      <Section id="location" style={{ scrollMarginTop: '90px' }}>
        <LocationTitle>Our Location</LocationTitle>
        <Address>
          76 Eastbank Street,<br />
          Soutport, UK<br />
          PR8 1EF
        </Address>
        <MapWrapper>
          <iframe
            title="Barber Shop Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.179804219527!2d-3.0026584655850725!3d53.64376606025772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487b3f28c2404633%3A0x865d00ff707467f9!2sLev3l%20barbers!5e0!3m2!1sen!2suk!4v1752950880062!5m2!1sen!2suk"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </MapWrapper>
      </Section>

        <Divider/>

      <Section id="info">
        <SectionTitle>Contact Info</SectionTitle>
        <ContactInfo>
          <p>Phone: <a href="tel:+441234567890">+44 7538 420684</a></p>
          <p>Email: <a href="mailto:lev3lbarbers@gmail.com">lev3lbarbers@gmail.com</a></p>
          <p>Social Media: LEV3L BARBERS </p>
        </ContactInfo>
      </Section>

      <Divider/>

      <Section id="hours">
        <OpeningTitle>Opening Hours</OpeningTitle>
        <OpeningHours>
          <li>Mon-Thu: 9:00 AM - 6:00 PM</li>
          <li>Fri-Sat: 9:00 AM - 7:00 PM</li>
          <li>Sun: 10:00 AM - 4:00 PM</li>
        </OpeningHours>
      </Section>
    </PageWrapper>
  );
};

export default ContactPage;

const PageWrapper = styled.div`
  background: linear-gradient(to bottom, #000000, #ffffff);
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #222;
  font-family: 'Bebas Neue', sans-serif;
`;

const Section = styled.section`
  max-width: 700px;
  width: 100%;
  margin-bottom: 60px;
  padding: 20px;
`;

const LocationTitle = styled.h2`
  font-family: 'Dancing Script', cursive;
  font-size: 3rem;
  text-align: center;
  margin-bottom: 25px;
  color: #f0f0f0;
  text-shadow:
    0 0 6px rgba(240, 240, 240, 0.7),
    0 0 12px rgba(240, 240, 240, 0.5),
    0 0 18px rgba(240, 240, 240, 0.3);
`;

const SectionTitle = styled.h2`
  font-family: 'Dancing Script', cursive;
  font-size: 2.8rem;
  text-align: center;
  margin-bottom: 25px;
  color: #222;
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.9),
    0 0 12px rgba(255, 255, 255, 0.7),
    0 0 18px rgba(255, 255, 255, 0.5),
    0 0 24px rgba(255, 255, 255, 0.3);
`;


const Address = styled.address`
  font-style: normal;
  font-size: 1.3rem;
  text-align: center;
  margin-bottom: 35px;
  color: #f0f0f0;
  line-height: 1.6;
`;

const MapWrapper = styled.div`
  width: 100%;
  height: 300px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0,0,0,0.3);
  margin-bottom: 40px;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const Divider = styled.div`
  width: 100%;
  max-width: 700px;
  height: 2px;
  background: rgba(34, 34, 34, 0.15);
  margin: 30px 0;
  box-shadow:
    0 0 8px rgba(34, 34, 34, 0.1);
  border-radius: 1px;
`;


const ContactInfo = styled.div`
  font-size: 1.3rem;
  text-align: center;
  color: #222;

  a {
    color: #222;
    text-decoration: none;
    font-weight: 700;

    &:hover {
      text-decoration: underline;
    }
  }

  p {
    margin: 10px 0;
  }
`;

const OpeningTitle = styled.h3`
  font-family: 'Dancing Script', cursive;
  font-size: 2.4rem;
  text-align: center;
  margin-bottom: 15px;
  color: #f2f2f2;
  text-shadow:
    0 0 4px rgba(0, 0, 0, 0.6),
    0 0 8px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(0, 0, 0, 0.3);
`;



const OpeningHours = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  color: #222;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;

  li {
    margin-bottom: 8px;
    text-align: center;
  }
`;
