import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Chart data objects
  chartData: any;
  doughnutData: any;
  lineData: any;
  barData: any;
  
  // Chart options objects
  doughnutOptions: any;
  lineOptions: any;
  barOptions: any;
  
  // Admin flag
  isAdmin: boolean = false;

  constructor(
    private apichartData: DataService, 
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getUser().role == 'Admin';
    if (this.isAdmin) {
      this.apichartData.getChartData().subscribe(
        data => {
          this.setupCharts(data);
        },
        error => {
          console.error('Error fetching chart data:', error);
        }
      );
    }
  }

  setupCharts(data: any): void {
    // Store base data for reference in template (used in stat cards and insights)
    this.chartData = {
      labels: ['People', 'Accounts', 'Transactions'],
      datasets: [
        {
          data: [data.peopleCount, data.accountCount, data.totalTransactions]
        },
        {
          data: [0, data.totalBalance, data.totalAmount]
        }
      ]
    };

    this.setupDoughnutChart(data);
    
    this.setupLineChart(data);
 
    this.setupBarChart(data);
  }

  private setupDoughnutChart(data: any): void {
    this.doughnutData = {
      labels: ['People', 'Accounts', 'Transactions'],
      datasets: [{
        data: [data.peopleCount, data.accountCount, data.totalTransactions],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)'
        ]
      }]
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    };
  }

  private setupLineChart(data: any): void {
    this.lineData = {
      labels: ['Start', 'Balance', 'Transactions'],
      datasets: [{
        label: 'Financial Flow',
        data: [0, data.totalBalance, data.totalAmount],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(168, 85, 247)',
        pointHoverBorderColor: '#fff'
      }]
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context: any) {
              return `$${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: function(value: any) {
              return '$' + value.toLocaleString();
            },
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  private setupBarChart(data: any): void {
    this.barData = {
      labels: ['People', 'Accounts', 'Transactions'],
      datasets: [
        {
          label: 'Count',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          data: [data.peopleCount, data.accountCount, data.totalTransactions],
          yAxisID: 'y',
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
        },
        {
          label: 'Amount ($)',
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgb(236, 72, 153)',
          borderWidth: 2,
          data: [0, data.totalBalance / 1000, data.totalAmount / 1000],
          yAxisID: 'y1',
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(236, 72, 153, 1)'
        }
      ]
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (context.datasetIndex === 1) {
                  // For amount dataset, multiply back by 1000
                  label += '$' + (context.parsed.y * 1000).toLocaleString();
                } else {
                  label += context.parsed.y.toLocaleString();
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            callback: function(value: any) {
              return value.toLocaleString();
            }
          },
          title: {
            display: true,
            text: 'Count',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            callback: function(value: any) {
              return '$' + (value * 1000).toLocaleString();
            },
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Amount ($)',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    };
  }
}