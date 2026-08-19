import { TextField } from '@sitecore-jss/sitecore-jss-nextjs';

interface StatisticProps {
  name?: TextField;
  value?: TextField;
}

const Statistic = ({ name, value }: StatisticProps) => {
  if (!value?.value) {
    return null;
  }

  return (
    <div>
      <span className="headline-xxl">{value.value}</span>
      <h6 className="eyebrow mt-1">{name?.value}</h6>
    </div>
  );
};

export default Statistic;
