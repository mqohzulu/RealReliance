import { Component } from '@angular/core';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  chartData: any;
  chartOptions: any;

  constructor(private apichartData:DataService){}

  ngOnInit() {
    this.apichartData.getChartData().subscribe(data => {
      this.setupChart(data);
    }
  )
  }

  setupChart(data: any) {
    this.chartData = {
      labels: ['People', 'Accounts', 'Transactions'],
      datasets: [
        {
          type: 'bar',
          label: 'Count',
          backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
          data: [data.peopleCount, data.accountCount, data.totalTransactions]
        },
        {
          type: 'line',
          label: 'Amount',
          borderColor: '#FF7043',
          fill: false,
          data: [0, data.totalBalance, data.totalAmount]
        }
      ]
    };
  
    this.chartOptions = {
      responsive: true,
      title: {
        display: true,
        text: 'Banking System Overview'
      },
      tooltips: {
        mode: 'index',
        intersect: true
      },
      scales: {
        yAxes: [{
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-1',
          ticks: {
            beginAtZero: true
          }
        }, {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-2',
          gridLines: {
            drawOnChartArea: false
          },
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
  }
}
