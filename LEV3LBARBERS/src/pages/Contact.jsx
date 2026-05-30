import React from "react";
import styled from "styled-components";
import background from '../assets/blackTools.jpg';

const ContactPage = () => {
  return (
    <PageWrapper>
      <Section id="location" style={{ scrollMarginTop: '90px' }}>
        <Title>Our Location</Title>
        <Address>
          76 Eastbank Street,<br />
          <strong>Soutport, UK</strong><br />
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

      <Section id="info" style={{ scrollMarginTop: '90px' }}>
        <Title>Contact Info</Title>
        <ContactInfo>
          <p><strong>Phone:</strong> <a href="tel:+441234567890">+44 7538 420684</a></p>
          <p><strong>Email:</strong> <a href="mailto:lev3lbarbers@gmail.com">lev3lbarbers@gmail.com</a></p>
          <p><strong>Social Media:</strong> LEV3L BARBERS </p>
        </ContactInfo>
      </Section>

      <Divider/>

      <Section id="hours" style={{ scrollMarginTop: '90px' }}>
        <Title>Opening Hours</Title>
        <OpeningHours>
          <li><strong>Mon-Thu:</strong> 9:00 AM - 6:00 PM</li>
          <li><strong>Fri-Sat:</strong> 9:00 AM - 7:00 PM</li>
          <li><strong>Sun:</strong> 10:00 AM - 4:00 PM</li>
        </OpeningHours>
      </Section>
    </PageWrapper>
  );
};

export default ContactPage;

const PageWrapper = styled.div`
  background: #0d0d0d;
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #f5f2ed;
  font-family: 'Bebas Neue', sans-serif;
`;

const Section = styled.section`
  max-width: 700px;
  width: 100%;
  margin-bottom: 60px;
  padding: 20px 30px 30px 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 25px;
  color: #f5f2ed;
`;

const Address = styled.address`
  font-style: normal;
  font-size: 1.3rem;
  text-align: center;
  margin-bottom: 25px;
  color: #f5f2ed;
  line-height: 1.6;

  strong {
    color: #c8a860;
    font-weight: 500;
  }
`;

const MapWrapper = styled.div`
  width: 100%;
  height: 300px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(212, 169, 104, 0.6);
  margin-bottom: 30px;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const Divider = styled.div`
  width: 80%;
  height: 2px;
  margin: 2rem auto 3rem auto;
  background: linear-gradient(to right, transparent, #D4A968, transparent);
  border-radius: 2px;
`;

const ContactInfo = styled.div`
  font-size: 1.3rem;
  text-align: center;
  color: #f5f2ed;

  a {
    color: #c8a860;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #f5f2ed;
    }
  }

  p {
    margin: 8px 0;
  }

  strong {
    color: #c8a860;
    font-weight: 500;
  }
`;

const OpeningHours = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  color: #f5f2ed;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;

  li {
    margin-bottom: 6px;
    text-align: center;
  }

  strong {
    color: #c8a860;
    font-weight: 500;
  }
`;
