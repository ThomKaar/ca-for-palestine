import type { EmailContent, UserInfo } from '../types/main.ts';
import { 
  getPrefix, 
  getFirstName,
  getLastName,
  getStreetAddressOne,
  getStreetAddressTwo,
  getCity,
  getState,
  getZipCode,
  getPhoneNumber,
  getEmailInput,
  getEmailConfirmationInput,
  getSubjectInput,
  getMessageTopic,
  getMessage,
  submitForm,
 } from './selectors.ts';
import puppeteer from 'puppeteer';



const contactSchiff = async (email: EmailContent, userInfo: UserInfo, options = { dev: true }) => {
  const { dev = true } = options;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to contact form
    await page.goto('https://www.schiff.senate.gov/contact/get-in-touch/');

    await getPrefix(page);
    await getFirstName(page, userInfo.firstName);
    await getLastName(page, userInfo.lastName);
    await getStreetAddressOne(page, userInfo.addressOne);
    await getStreetAddressTwo(page, userInfo.addressTwo);
    await getCity(page, userInfo.city);
    await getState(page, userInfo.state);
    await getZipCode(page, userInfo.zipCode);
    await getPhoneNumber(page, userInfo.phoneNumber);
    await getEmailInput(page, userInfo.email);
    await getEmailConfirmationInput(page, userInfo.email);
    await getSubjectInput(page, email.subject);
    await getMessageTopic(page);
    await getMessage(page, email.body);
    if (!dev) {
      await submitForm(page);
    }
  } catch (e) {
    console.error('Error in contactSchiff:', e);
  } finally {
      if (!dev) {
          await browser.close();
      }
  }
};

export { contactSchiff };