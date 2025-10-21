import { useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec';

export default function TestAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setIsLoading(true);
    setResult('');
    setError('');

    try {
      console.log('Testing connection to:', GOOGLE_SCRIPT_URL);
      
      // ทดสอบ GET request
      const getResponse = await fetch(`${GOOGLE_SCRIPT_URL}?getAll=1`, {
        method: 'GET',
        mode: 'cors',
      });
      
      console.log('GET Response status:', getResponse.status);
      console.log('GET Response headers:', getResponse.headers);
      
      const getText = await getResponse.text();
      console.log('GET Response text:', getText);
      
      if (getResponse.ok) {
        setResult('✅ GET request สำเร็จ!');
      } else {
        setError(`❌ GET request ล้มเหลว: ${getResponse.status} - ${getText}`);
        return;
      }

      // ทดสอบ POST request
      const testData = {
        action: 'addCustomer',
        licensePlate: 'TEST-1234',
        customerName: 'ทดสอบ',
        phone: '0812345678',
        registerDate: '01/01/2024',
        status: 'รอดำเนินการ',
        brand: 'Test Car',
        note: 'Test data'
      };

      console.log('Testing POST with data:', testData);
      
      // ใช้ FormData แทน JSON เพื่อหลีกเลี่ยง CORS preflight
      const formDataToSend = new FormData();
      Object.keys(testData).forEach(key => {
        formDataToSend.append(key, testData[key as keyof typeof testData]);
      });

      const postResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend,
      });
      
      console.log('POST Response status:', postResponse.status);
      
      const postText = await postResponse.text();
      console.log('POST Response text:', postText);
      
      if (postResponse.ok) {
        setResult(prev => prev + '\n✅ POST request สำเร็จ!');
      } else {
        setError(prev => prev + `\n❌ POST request ล้มเหลว: ${postResponse.status} - ${postText}`);
      }

    } catch (err) {
      console.error('Connection test error:', err);
      setError(`❌ เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full mx-auto border border-gray-100 dark:border-gray-800 p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
        ทดสอบการเชื่อมต่อ API
      </h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          URL: {GOOGLE_SCRIPT_URL}
        </p>
      </div>

      <button
        onClick={testConnection}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin" />
            กำลังทดสอบ...
          </>
        ) : (
          <>
            <FaCheckCircle />
            ทดสอบการเชื่อมต่อ
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <FaCheckCircle />
            <span className="font-medium">ผลการทดสอบ:</span>
          </div>
          <pre className="mt-2 text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <FaExclamationCircle />
            <span className="font-medium">ข้อผิดพลาด:</span>
          </div>
          <pre className="mt-2 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>💡 เปิด Developer Tools (F12) เพื่อดู console logs</p>
        <p>💡 ตรวจสอบ Network tab เพื่อดู HTTP requests</p>
      </div>
    </div>
  );
}
