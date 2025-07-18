import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
export class mailService{
     private transporter = nodemailer.createTransport({
    // service: 'gmail', // or SMTP config
      host:'mail.infomaniak.com',
      port:465,
    auth: {
      user: process.env.FROM_EMAIL,
      pass: process.env.FROM_PASS,
    },
  });

  async send(options: { to: string; subject: string; html: string }) {
    const { to, subject, html } = options;

   const sendMail= await this.transporter.sendMail({
    //   from: `"My App" <${process.env.FROM_EMAIL}>`,
     from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log("sendMail",sendMail)
  }
}