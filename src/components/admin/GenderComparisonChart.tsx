"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type GenderComparisonChartProps = {
  categories: string[];
  maleData: number[];
  femaleData: number[];
};

export default function GenderComparisonChart({
  categories,
  maleData,
  femaleData,
}: GenderComparisonChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: false,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      height: 180,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    colors: ["#3b82f6", "#ec4899"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      labels: {
        formatter: (val: number) => val.toFixed(0),
      },
      forceNiceScale: true,
      tickAmount: 5,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} orang`,
      },
      shared: true,
      intersect: false,
      enabled: true,
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
  };

  const series = [
    { name: "Pria", data: maleData },
    { name: "Wanita", data: femaleData },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Gender Distribution
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 w-full xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  );
}
