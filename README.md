# VSB Energy Visualizer & Forecasting

A comprehensive energy consumption dashboard for visualizing UK electricity data from 2009 to 2024, built with Vue.js and Node.js.

## Features

- **Real-time Data Visualization**: Interactive charts showing electricity demand trends
- **Historical Analysis**: Data spanning 15 years (2009-2024)
- **Renewable Energy Tracking**: Wind and solar generation monitoring
- **Modular Architecture**: Separate APIs for electricity and gas data
- **Production Ready**: Optimized build system with development and production modes

## Technology Stack

### Frontend
- **Vue.js 3**: Modern reactive framework
- **ApexCharts**: Interactive data visualization
- **Vuex**: State management
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **CSV Parser**: Data processing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

## Project Structure

```
├── Graph-Frontend/          # Vue.js frontend application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/          # Page views
│   │   ├── store/          # Vuex store
│   │   └── config/         # Configuration files
│   └── public/             # Static assets
├── Graph-Backend/          # Node.js backend services
│   ├── services/
│   │   ├── electricity/    # Electricity API service
│   │   └── gas/           # Gas API service (future)
│   ├── middleware/         # Express middleware
│   └── config/            # Configuration files
├── Start-Dashboard.bat     # Development launcher
└── Start-Dashboard-Production.bat  # Production launcher
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sylv111/vsb-energy-visualizer-forecasting.git
   cd vsb-energy-visualizer-forecasting
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd Graph-Backend
   npm install
   
   # Install frontend dependencies
   cd ../Graph-Frontend
   npm install
   ```

3. **Start development servers**
   ```bash
   # From project root
   ./Start-Dashboard.bat
   ```

### Development Mode
- Frontend: http://localhost:8080
- Backend Orchestrator: http://localhost:3000
- Electricity API: http://localhost:3001
- Gas API: http://localhost:3002

### Production Mode
```bash
# Build and start production version
./Start-Dashboard-Production.bat
```

## API Endpoints

### Main Orchestrator (Port 3000)
- `GET /api/health` - Health check
- `GET /api` - Service information

### Electricity API (Port 3001)
- `GET /api/electricity/health` - Health check
- `GET /api/electricity/data` - All electricity data
- `GET /api/electricity/stats` - Statistics
- `GET /api/electricity/data/aggregated/:period` - Aggregated data
- `GET /api/electricity/data/year/:year` - Data by year
- `POST /api/electricity/reload` - Reload data

### Gas API (Port 3002)
- `GET /api/gas/health` - Health check
- `GET /api/gas/data` - Gas data (future implementation)
- `GET /api/gas/stats` - Gas statistics (future implementation)

## Data Sources

The application processes UK electricity consumption data including:
- England & Wales demand
- Embedded wind generation
- Embedded solar generation
- Settlement periods and dates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## University Project

This project is developed for VSB Technical University of Ostrava (VSB TUO) in the Czech Republic.

## Support

For support and questions, please open an issue on GitHub. 