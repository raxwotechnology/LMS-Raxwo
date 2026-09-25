import https from 'https';
import { URL } from 'url';

// SMS Service using SMS Lenz API
const SMS_LENZ_CONFIG = {
  userId: '870',
  apiKey: '461c54e6-830c-4722-b181-1fa0943f7519',
  baseUrl: 'https://smslenz.lk/api',
  endpoint: 'https://smslenz.lk/api/send-sms',
  senderId: 'WISDOMEDU'
};

/**
 * Send SMS using SMS Lenz API
 * @param {string} mobileNumber - Mobile number 
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - Response from SMS API
 */
export const sendSMS = async (mobileNumber, message) => {
  try {
    if (!mobileNumber) {
      return {
        success: false,
        error: 'Mobile number is required'
      };
    }

    let mobileStr = String(mobileNumber).trim();
    let cleanMobile = mobileStr.replace(/[\s\-\(\)\+]/g, '');
    let formattedMobile = cleanMobile;
    
    if (cleanMobile.startsWith('94')) {
      formattedMobile = cleanMobile;
    } else if (cleanMobile.startsWith('0')) {
      formattedMobile = '94' + cleanMobile.substring(1);
    } else if (cleanMobile.length === 9) {
      formattedMobile = '94' + cleanMobile;
    } else {
      formattedMobile = cleanMobile;
    }

    const contactNumber = '+' + formattedMobile;

    const params = new URLSearchParams({
      user_id: SMS_LENZ_CONFIG.userId,
      api_key: SMS_LENZ_CONFIG.apiKey,
      sender_id: SMS_LENZ_CONFIG.senderId, 
      contact: contactNumber, 
      message: message
    });

    return new Promise((resolve) => {
      const url = new URL(SMS_LENZ_CONFIG.endpoint);
      const postData = params.toString();

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(responseData);
          } catch {
            data = { message: responseData, raw: responseData };
          }

          if (res.statusCode === 200 || (data && (data.success || data.status === 'success' || (data.message && data.message.toLowerCase().includes('success'))))) {
            resolve({
              success: true,
              data: data
            });
          } else {
            resolve({
              success: false,
              error: data.message || data.error || data.raw || 'Failed to send SMS'
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('HTTPS Request Error:', error);
        resolve({
          success: false,
          error: error.message || 'Failed to send SMS'
        });
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};

/**
 * Send SMS when student attempts a class
 * @param {Object} student - Student object with mobile number
 * @param {Object} classInstance - Class object with subject information, date, and time
 * @returns {Promise<Object>} - SMS sending result
 */
export const sendClassAttemptSMS = async (student, classInstance) => {
  try {
    if (!student.mobile) {
      return { success: false, error: 'Mobile number not found' };
    }

    let subjectName = 'the class';
    if (classInstance.subjectId) {
      if (typeof classInstance.subjectId === 'object' && classInstance.subjectId.name) {
        subjectName = classInstance.subjectId.name;
      } else {
        const Subject = (await import('@/lib/models/Subject')).default;
        const subject = await Subject.findById(classInstance.subjectId);
        if (subject) {
          subjectName = subject.name;
        }
      }
    }

    let dateMonthStr = '';
    if (classInstance.date) {
      const classDate = new Date(classInstance.date);
      if (!isNaN(classDate.getTime())) {
        const day = classDate.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[classDate.getMonth()];
        dateMonthStr = `${day} ${monthName}`;
      } else if (typeof classInstance.date === 'string') {
        try {
          const parsedDate = new Date(classInstance.date);
          if (!isNaN(parsedDate.getTime())) {
            const day = parsedDate.getDate();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[parsedDate.getMonth()];
            dateMonthStr = `${day} ${monthName}`;
          } else {
            dateMonthStr = classInstance.date;
          }
        } catch {
          dateMonthStr = classInstance.date;
        }
      }
    }

    let message = `Thank You! Your attendance for ${subjectName}`;
    if (dateMonthStr) {
      message += ` on ${dateMonthStr}`;
    }
    message += ` is recorded - Wisdom Institute`;

    return await sendSMS(student.mobile, message);
  } catch (error) {
    console.error('Error sending class attempt SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send SMS when payment is recorded
 * @param {Object} student - Student object with mobile number
 * @param {Object} payment - Payment object with payment details
 * @returns {Promise<Object>} - SMS sending result
 */
export const sendPaymentSMS = async (student, payment) => {
  try {
    if (!student.mobile) {
      return { success: false, error: 'Mobile number not found' };
    }

    const price = payment.totalAmount || 0;
    const paymentMonth = payment.month || '';
    
    let monthText = '';
    if (paymentMonth) {
      if (typeof paymentMonth === 'string' && paymentMonth.includes(',')) {
        const months = paymentMonth.split(',').map(m => m.trim()).filter(m => m);
        if (months.length > 1) {
          const lastMonth = months.pop();
          monthText = months.join(', ') + ' and  ' + lastMonth;
        } else {
          monthText = paymentMonth;
        }
      } else if (Array.isArray(paymentMonth)) {
        const months = paymentMonth.filter(m => m);
        if (months.length > 1) {
          const lastMonth = months.pop();
          monthText = months.join(', ') + ' and for ' + lastMonth;
        } else {
          monthText = months[0] || '';
        }
      } else {
        monthText = paymentMonth;
      }
    }

    let message = `Thank You! We received your payment of LKR ${price}`;
    if (monthText) {
      message += ` for ${monthText}`;
    }
    message += ` - Wisdom Institute`;

    return await sendSMS(student.mobile, message);
  } catch (error) {
    console.error('Error sending payment SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
