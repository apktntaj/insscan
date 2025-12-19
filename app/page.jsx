import ActionTableWrapper from "./ui/FileReaderWrapper";
import Title from "./ui/Title";

const Home = () => {
  return (
    <div className='container'>
      <Title title="INSScan" descs={[]} />
      <ActionTableWrapper />
    </div>
  );
};

export default Home;

// TODO: take a rest for a while
