import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import API from "../api";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

// Map party abbreviations to colors
const partyColors = {
  DP: "#007bff",
  NUF: "#28a745",
  IP: "#ffc107",
};

// Interactive tooltip component
const InfoTooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [showComparison, setShowComparison] = useState(false);
  const [timeFrame, setTimeFrame] = useState('hourly');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await API.get("/votes/results/1/");
        setResults(res.data);
        if (res.data.positions && res.data.positions.length > 0) {
          setSelectedPosition(res.data.positions[0].position_id);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Unable to load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleBack = () => navigate("/dashboard");

  const getChartData = (position) => {
    return {
      labels: position.candidates.map(c => `${c.name} (${c.party})`),
      datasets: [
        {
          data: position.candidates.map(c => c.votes),
          backgroundColor: position.candidates.map(c => partyColors[c.party] || `hsl(${Math.random() * 360}, 70%, 50%)`),
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    };
  };

  const getBarChartData = (position) => {
    return {
      labels: position.candidates.map(c => c.name.split(' ')[0]),
      datasets: [
        {
          label: 'Votes Received',
          data: position.candidates.map(c => c.votes),
          backgroundColor: position.candidates.map(c => partyColors[c.party] || '#007bff'),
          borderRadius: 8,
          barPercentage: 0.7,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} votes (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Votes',
          font: { weight: 'bold' },
        },
        ticks: {
          callback: (value) => value.toLocaleString(),
        },
      },
      x: {
        title: {
          display: true,
          text: 'Candidates',
          font: { weight: 'bold' },
        },
      },
    },
  };

  // Generate mock historical data (replace with real API data)
  const getHistoricalData = (position) => {
    const timeLabels = timeFrame === 'hourly' 
      ? ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM']
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    return {
      labels: timeLabels,
      datasets: position.candidates.slice(0, 3).map((candidate, idx) => ({
        label: candidate.name,
        data: timeLabels.map((_, i) => Math.floor(candidate.votes * (0.5 + (i / timeLabels.length) * 0.5))),
        borderColor: partyColors[candidate.party] || `hsl(${idx * 120}, 70%, 50%)`,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={handleBack} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const currentPositionData = results.positions.find(p => p.position_id === selectedPosition);
  const totalOverallVotes = results.positions.reduce(
    (sum, pos) => sum + pos.candidates.reduce((s, c) => s + c.votes, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              📊 {results.election_title} Results
            </h1>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{results.positions.length}</div>
              <div className="text-sm text-gray-600">Positions</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{totalOverallVotes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((totalOverallVotes / (results.positions.length * 1000)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Turnout</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg transition"
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </button>
            </div>
          </div>
        </div>

        {/* Position Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Position</label>
          <div className="flex flex-wrap gap-2">
            {results.positions.map(position => (
              <button
                key={position.position_id}
                onClick={() => setSelectedPosition(position.position_id)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedPosition === position.position_id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {position.position_title}
              </button>
            ))}
          </div>
        </div>

        {currentPositionData && (
          <div className="space-y-6">
            {/* Chart Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentPositionData.position_title} - Vote Distribution
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1 rounded-lg transition ${
                      chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Pie Chart
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg transition ${
                      chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Bar Chart
                  </button>
                </div>
              </div>
              
              <div className="h-96">
                {chartType === 'pie' ? (
                  <Pie data={getChartData(currentPositionData)} options={chartOptions} />
                ) : (
                  <Bar data={getBarChartData(currentPositionData)} options={barOptions} />
                )}
              </div>
            </div>

            {/* Historical Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">📈 Voting Trends</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeFrame('hourly')}
                    className={`px-3 py-1 rounded-lg transition ${
                      timeFrame === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Hourly
                  </button>
                  <button
                    onClick={() => setTimeFrame('weekly')}
                    className={`px-3 py-1 rounded-lg transition ${
                      timeFrame === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              <div className="h-80">
                <Line data={getHistoricalData(currentPositionData)} options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Cumulative Votes' },
                    },
                  },
                }} />
              </div>
            </div>

            {/* Candidates List with Progress Bars */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Candidate Details</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {currentPositionData.candidates.map((candidate) => {
                  const totalVotes = currentPositionData.candidates.reduce((sum, c) => sum + c.votes, 0);
                  const percentage = totalVotes ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
                  const barColor = partyColors[candidate.party] || "#007bff";

                  return (
                    <div key={candidate.candidate_id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <img
                            src={candidate.image_url}
                            alt={candidate.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/64?text=?";
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-gray-900 text-lg">{candidate.name}</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                {candidate.party}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="font-medium text-blue-600">{candidate.votes.toLocaleString()} votes</span>
                              <span>•</span>
                              <InfoTooltip text="Percentage of total votes for this position">
                                <span className="cursor-help">{percentage}%</span>
                              </InfoTooltip>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Position Comparison */}
            {showComparison && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">🏆 Position Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leading Candidate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.positions.map(pos => {
                        const sorted = [...pos.candidates].sort((a, b) => b.votes - a.votes);
                        const winner = sorted[0];
                        const second = sorted[1];
                        const margin = second ? ((winner.votes - second.votes) / winner.votes * 100).toFixed(1) : 100;
                        return (
                          <tr key={pos.position_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pos.position_title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{winner.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{winner.votes.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${margin < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {margin}% lead
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}