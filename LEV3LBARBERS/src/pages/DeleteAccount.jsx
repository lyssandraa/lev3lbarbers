import React from "react";
import styled from "styled-components";

const CREAM = "#f4f0e8";
const INK   = "#1a1a1a";
const RED   = "#C41E3A";

// Public page (no login required) — required by Google Play's Data Safety
// disclosures: even though account deletion is fully self-service in-app,
// Play Console requires a reachable web page describing the process for
// someone who doesn't have the app installed, or isn't currently logged in.
const DeleteAccount = () => (
  <Wrap>
    <Card>
      <Eyebrow>LEV3L BARBERS</Eyebrow>
      <Title>Delete Your Account</Title>
      <Rule />

      <Section>
        <SectionTitle>In the app</SectionTitle>
        <Steps>
          <li>Open the LEV3L Barbers app and log in.</li>
          <li>Go to <strong>Profile</strong>.</li>
          <li>Scroll to the <strong>Delete Account</strong> option and confirm.</li>
        </Steps>
      </Section>

      <Section>
        <SectionTitle>On the website</SectionTitle>
        <Steps>
          <li>Log in at <a href="/login">lev3lbarbers.com/login</a>.</li>
          <li>Go to your <a href="/profile">Profile</a> page.</li>
          <li>Scroll to the <strong>Delete Account</strong> option and confirm.</li>
        </Steps>
      </Section>

      <Section>
        <SectionTitle>What gets deleted</SectionTitle>
        <Body>
          Deleting your account removes your profile, loyalty stamps, rewards, wallet
          balance, and saved details. Records the shop is legally required to keep
          (such as past bookings and payment records for tax/accounting purposes) may
          be retained in anonymised form, as described in our{" "}
          <a href="/privacy-notice">Privacy Notice</a>.
        </Body>
      </Section>

      <Section>
        <SectionTitle>Can't log in?</SectionTitle>
        <Body>
          If you're unable to log in to request deletion yourself, contact us directly
          and we'll process the request manually.
        </Body>
      </Section>
    </Card>
  </Wrap>
);

export default DeleteAccount;

const Wrap = styled.div`
  min-height: 100vh;
  background: ${CREAM};
  display: flex;
  justify-content: center;
  padding: 4rem 1.5rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 620px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 2.5rem;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 3px;
  color: ${RED};
  margin: 0 0 0.4rem;
`;

const Title = styled.h1`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.2rem;
  letter-spacing: 1px;
  color: ${INK};
  margin: 0;
`;

const Rule = styled.div`
  width: 48px;
  height: 2px;
  background: ${RED};
  margin: 1rem 0 2rem;
`;

const Section = styled.div`
  margin-bottom: 1.75rem;
  &:last-child { margin-bottom: 0; }
`;

const SectionTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 1px;
  color: ${INK};
  margin: 0 0 0.6rem;
`;

const Steps = styled.ol`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  color: rgba(26, 26, 26, 0.75);
  line-height: 1.7;
  margin: 0;
  padding-left: 1.2rem;
  a { color: ${RED}; }
`;

const Body = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  color: rgba(26, 26, 26, 0.75);
  line-height: 1.7;
  margin: 0;
  a { color: ${RED}; }
`;
