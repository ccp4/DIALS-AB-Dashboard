import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react";
import { Autocomplete, TextField } from '@mui/material';
function RawDataChart({typeOfData, run}){

    const apiURL = "http://localhost:8000"
    const [rawData, setRawData] = useState({})
    const [selectRun, setSelectRun] = useState(null)
    const [selectTrace, setSelectTrace] = useState(null)
    const [load, setLoad] = useState(true)

    useEffect(() => {
        const fetchData = async() => {
            try{
                setLoad(true)
                const res = await fetch(apiURL + "/runs/" + run + "/" + typeOfData)
                if (res.ok) {
                    const data = await res.json()
                    setRawData(data)
                    const keys = Object.keys(data)
                    setSelectRun(keys[0])
                }

            } catch (err) {
                console.log(err.message)
            }   finally {
                setLoad(false)
            }

        }

        fetchData();
    }, [])

    if (load) { return("Loading")}

    const keys = Object.keys(rawData)
    const traces = Object.keys(rawData?.[selectRun] ?? {});

    const series = [];

    for (const trace of rawData?.[selectRun]?.[selectTrace] ?? []){
        series.push({
        name: trace?.name ?? "Empty",
        type: "line",
        data: trace?.data ?? [],
        showSymbol: false,
        });
    }

    const option = {
        title: {
          text: `${selectRun} → ${selectTrace}`,
        },
    
        tooltip: {
          trigger: "axis",
          axisPointer: { type: 'cross' },
          formatter: (params) => {
            if (!params.length) return "";
    
            const xRaw = params[0].value[0];
            const xDisplay = Math.sqrt(1 / xRaw).toFixed(3)
    
            let text = `x: ${xDisplay}<br/>`;
    
            params.forEach((p) => {
              text += `${p.marker} ${p.seriesName}: ${p.value[1]}<br/>`;
            });
    
            return text;
          },
        },
    
        legend: {
          orient: "vertical",
          right: 0,
          top: "center",
        },
    
        dataZoom: [
          { type: "inside" },
          { type: "slider" },
        ],
    
        xAxis: {
          type: "value",
          name: "Resolution (d)",
          nameLocation: "middle",
          nameGap: 30,
    
          axisLabel: {
            formatter: (value) => {
    
              const d = Math.sqrt(1 / value);
              return d.toFixed(2); 
            },
          },
        },
    
        yAxis: { 
          type: "value",
          name: `${selectTrace}`,
          nameLocation: "middle", 
          nameRotate: 90,           
          nameGap: 30,              
        },
    
        grid: {
          left: "5%",
          right: "20%",
          top: "10%",
          bottom: "15%",
          containLabel: true,
        },
    
        series,
      }
    

    return(
        <>

            <Autocomplete
                disablePortal
                options={ keys }
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Select run" />}
                value={selectRun}
                onChange={(e, run) => {setSelectRun(run)}}
            />

            <br />

            <Autocomplete
                disablePortal
                options={ traces }
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Select trace" />}
                value={selectTrace}
                onChange={(e, trace) => {setSelectTrace(trace)}}
            />

            <ReactECharts
                option={option}
                style={{ height: 600, width: "30vw" }}
                notMerge={true}
                lazyUpdate={true}
            />


        </>
    )
}

export default RawDataChart