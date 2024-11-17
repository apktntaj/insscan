import ActionTableWrapper from "./ui/FileReaderWrapper";
import Title from "./ui/Title";

// make it simple
const Home = () => {
  return (
    <div className='container'>
      <Title
        title='Solusi otomatis untuk mengambil data pajak dari situs INSW berdasarkan kumpulan HS Code dari Invoice. 
      Dengan INSScan, Anda bisa memproses banyak data sekaligus dan mendapatkan hasil dalam format Excel tanpa repot. Hemat waktu, tingkatkan produktivitas!'
      />
      <ActionTableWrapper />
    </div>
  );
};

export default Home;
