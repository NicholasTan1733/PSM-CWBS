export const sendEmailWithTemplate = async (to, subject, htmlTemplate) => {
  try {
    // For development/testing purposes, we'll log the email
    console.log('📧 Email Service - Sending email:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Template:', htmlTemplate);
    
    // In a real app, you would call your email service API here
    // Example with EmailJS:
    /*
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'your_service_id',
        template_id: 'your_template_id',
        user_id: 'your_user_id',
        template_params: {
          to_email: to,
          subject: subject,
          html_content: htmlTemplate,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */
    
    // Example with a simple backend endpoint:
    /*
    const response = await fetch('https://your-backend.com/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key',
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlTemplate,
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */
    
    // For now, simulate successful email sending
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    return {
      success: true,
      message: 'Email sent successfully'
    };
    
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (userEmail, userName) => {
  const welcomeTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2c4c9c, #5274c9); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Swift Car Wash</h1>
        <p style="color: white; margin: 5px 0;">Welcome to Our Service!</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9ff;">
        <h2 style="color: #2c4c9c; margin-bottom: 20px;">Welcome, ${userName}!</h2>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Thank you for joining Swift Car Wash! We're excited to have you as part of our community.
        </p>
        
        <div style="background: white; border-radius: 10px; padding: 20px; margin: 25px 0; text-align: center;">
          <h3 style="color: #2c4c9c; margin: 0;">Your account is ready!</h3>
          <p style="color: #666; margin: 10px 0 0 0;">Start booking your car wash services today</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to contact our support team.
        </p>
      </div>
      
      <div style="background: #2c4c9c; padding: 20px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 12px;">
          © 2025 Swift Car Wash. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return await sendEmailWithTemplate(userEmail, 'Welcome to Swift Car Wash!', welcomeTemplate);
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  const confirmationTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2c4c9c, #5274c9); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Swift Car Wash</h1>
        <p style="color: white; margin: 5px 0;">Booking Confirmation</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9ff;">
        <h2 style="color: #2c4c9c; margin-bottom: 20px;">Booking Confirmed!</h2>
        
        <div style="background: white; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #2c4c9c; margin-top: 0;">Booking Details:</h3>
          <p><strong>Service:</strong> ${bookingDetails.service}</p>
          <p><strong>Date & Time:</strong> ${bookingDetails.dateTime}</p>
          <p><strong>Vehicle:</strong> ${bookingDetails.vehicle}</p>
          <p><strong>Total Amount:</strong> ${bookingDetails.amount}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          We'll send you a reminder before your appointment. Thank you for choosing Swift Car Wash!
        </p>
      </div>
      
      <div style="background: #2c4c9c; padding: 20px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 12px;">
          © 2025 Swift Car Wash. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return await sendEmailWithTemplate(userEmail, 'Booking Confirmed - Swift Car Wash', confirmationTemplate);
};