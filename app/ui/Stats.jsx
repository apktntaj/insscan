export default function Stats({ info }) {
  return (
    <div className='stats shadow'>
      <div className='stat'>
        <div className='stat-title'>{info.title}</div>
        <div className='stat-value'>{info.value}</div>
        <div className='stat-desc'>{info.desc}</div>
      </div>
    </div>
  );
}
