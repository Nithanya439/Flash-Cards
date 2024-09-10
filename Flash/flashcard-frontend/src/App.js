import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all summaries when the component mounts
  useEffect(() => {
    fetchSummaries();
  }, []);

  // Function to fetch summaries from the server
  const fetchSummaries = async () => {
    try {
      const response = await fetch('http://localhost:3001/summaries');
      if (!response.ok) {
        throw new Error('Error fetching summaries');
      }
      const data = await response.json();
      setSummaries(data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      // Upload the PDF file
      const uploadResponse = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error uploading file');
      }

      const responseData = await uploadResponse.json();
      setSummary(responseData.summary);
      fetchSummaries(); // Refresh the summaries after uploading
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  return (
    <div className="App">
      <h1>Summarized PDF Text</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload and Summarize</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {summary && (
        <div>
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}
      <h2>Stored Summaries</h2>
      <ul>
        {summaries.map((summaryObj, index) => (
          <li key={index}>
            <strong>PDF Name:</strong> {summaryObj.pdfName}
            <br />
            <strong>Summary:</strong> {summaryObj.summary}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
