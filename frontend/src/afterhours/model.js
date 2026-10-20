import {sampleLocation,sampleTelemetry,transformFor} from '../replay/fleetModel.js';
export const modulo=(value,size)=>((value%size)+size)%size;
export function danceFrame(data,elapsed,formation='spread'){
 const scale=transformFor(data.reference).scale;
 return data.drivers.map((d,i)=>{
  const offset=formation==='spread'?i/data.drivers.length*d.lap_time_s:0,time=modulo(elapsed+offset,d.lap_time_s);
  return {...d,...sampleLocation(d.location,time,scale),...sampleTelemetry(d.car_data,time),lap_time:time,progress:time/d.lap_time_s,offset_s:offset};
 });
}
export function circuitMap(reference,width,height){
 const xs=reference.trace.x,ys=reference.trace.y,minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(width*.76/(maxX-minX),height*.72/(maxY-minY)),ox=(width-(maxX-minX)*scale)/2,oy=(height-(maxY-minY)*scale)/2;
 const point=(x,y)=>[(x-minX)*scale+ox,height-((y-minY)*scale+oy)];return {point,points:xs.map((x,i)=>point(x,ys[i])),scale};
}
export function mixTelemetry(row){return {speed:Number.isFinite(row?.speed)?row.speed:0,rpm:Number.isFinite(row?.rpm)?row.rpm:0,throttle:Number.isFinite(row?.throttle)?row.throttle:0,gear:Number.isFinite(row?.gear)?row.gear:0,brake:Number.isFinite(row?.brake)?row.brake:0,available:!!row?.telemetryAvailable}}
