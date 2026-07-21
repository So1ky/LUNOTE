import { Redirect } from 'expo-router';

// TODO: 인증 상태 저장소 연동 후 로그인 여부에 따라 분기
export default function Index() {
  return <Redirect href="/login" />;
}
