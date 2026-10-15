import HeroSub from "@/components/SharedComponents/HeroSub";
import Payment from "@/components/Home/Payment";
import Benefit from "@/components/Home/Benefit";
import Spend from "@/components/Home/Spend";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Services | Nicktio",
};

const Services = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/services", text: "Services" },
  ];
  return (
    <>
      <HeroSub
        title="Services"
        description="Discover a wealth of insightful materials meticulously crafted to provide you with a comprehensive understanding of the latest trends."
        breadcrumbLinks={breadcrumbLinks}
      />
      <Payment />
      <Benefit />
      <Spend />
    </>
  );
};

export default Services;
