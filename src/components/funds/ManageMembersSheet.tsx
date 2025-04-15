import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Fund, User } from "@/types";
import { useApp } from "@/context/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, X, UserMinus, Loader2, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { addFundMember, removeFundMember } from "@/firebase/fundService";
import { searchUsers, createUserSuggestionFromEmail } from "@/firebase/userService";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ManageMembersSheetProps {
  fund: Fund;
  children: React.ReactNode;
}

export function ManageMembersSheet({ fund, children }: ManageMembersSheetProps) {
  const { currentUser, getUserById, loadUserFunds, addMemberByEmail, findUserByEmail } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [localFund, setLocalFund] = useState<Fund>(fund);
  
  // User search functionality
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local fund when prop changes
  useEffect(() => {
    setLocalFund(fund);
  }, [fund]);

  // Get member users
  const memberUsers = localFund.members.map(memberId => {
    const user = getUserById(memberId);
    return user || {
      id: memberId,
      displayName: `User ${memberId.substring(0, 4)}`,
      email: '',
      photoURL: ''
    };
  });

  // Filter members based on search term
  const filteredMembers = searchTerm 
    ? memberUsers.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : memberUsers;

  // Search for users as the user types
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }
    
    // Set a timeout to avoid too many searches
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search for users
        const results = await searchUsers(userSearchQuery);
        
        // If the query looks like an email but no results, add a suggestion
        if (results.length === 0 && validateEmail(userSearchQuery)) {
          const suggestion = createUserSuggestionFromEmail(userSearchQuery);
          setUserSearchResults([suggestion]);
        } else {
          setUserSearchResults(results);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [userSearchQuery]);
  
  const validateEmail = (email: string): boolean => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSelectUser = (user: User) => {
    setNewMemberEmail(user.email);
    setIsUserSearchOpen(false);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !localFund.id) return;
    
    // Reset previous error
    setEmailError(null);
    
    // Validate email format
    if (!validateEmail(newMemberEmail)) {
      setEmailError("Email không hợp lệ");
      return;
    }
    
    // Check if trying to add own email
    if (currentUser?.email.toLowerCase() === newMemberEmail.toLowerCase()) {
      setEmailError("Bạn đã là thành viên của quỹ này");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First check if user already exists in the fund
      const existingUser = await findUserByEmail(newMemberEmail);
      
      if (existingUser) {
        // Check if user is already a member
        if (localFund.members.includes(existingUser.id)) {
          setEmailError("Người dùng đã là thành viên của quỹ này");
          return;
        }
      }
      
      // Add user to fund
      const success = await addMemberByEmail(localFund.id, newMemberEmail);
      
      if (success) {
        // Reset input on success
        setNewMemberEmail("");
        setUserSearchQuery("");
        
        // Update local fund state with new member
        if (existingUser) {
          setLocalFund(prev => ({
            ...prev,
            members: [...prev.members, existingUser.id]
          }));
        } else {
          // Reload funds to get updated member list
          if (currentUser) {
            // Just reload the funds in the background
            loadUserFunds(currentUser.id);
            
            // Since we don't have direct access to the updated fund data,
            // we'll update our local state with what we know
            setLocalFund(prev => {
              // Add a placeholder for the new member
              // The actual data will be updated when the component re-renders with new props
              return {
                ...prev,
                members: [...prev.members, `pending_${Date.now()}`]
              };
            });
          }
        }
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Không thể thêm thành viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!localFund.id) return;
    
    // Don't allow removing the current user (fund creator)
    if (memberId === currentUser?.id) {
      toast.error("Bạn không thể xóa chính mình khỏi quỹ");
      return;
    }
    
    setMemberToRemove(memberId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !localFund.id) return;
    
    try {
      setIsLoading(true);
      await removeFundMember(localFund.id, memberToRemove);
      
      // Update local state immediately
      setLocalFund(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== memberToRemove)
      }));
      
      // Also reload funds in the background to keep global state in sync
      if (currentUser) {
        loadUserFunds(currentUser.id);
      }
      
      toast.success("Đã xóa thành viên khỏi quỹ");
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Không thể xóa thành viên");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Quản lý thành viên</SheetTitle>
            <SheetDescription>
              Thêm hoặc xóa thành viên trong quỹ "{localFund.name}"
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Search members */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thành viên..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Add new member */}
            <div>
              <h3 className="text-sm font-medium mb-2">Thêm thành viên mới</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                <Popover open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm người dùng hoặc nhập email..."
                        className={`pl-10 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        value={newMemberEmail}
                        onChange={(e) => {
                          setNewMemberEmail(e.target.value);
                          setUserSearchQuery(e.target.value);
                          setEmailError(null); // Clear error when typing
                          if (e.target.value.length > 1) {
                            setIsUserSearchOpen(true);
                          } else {
                            setIsUserSearchOpen(false);
                          }
                        }}
                        onClick={() => {
                          if (newMemberEmail.length > 1) {
                            setIsUserSearchOpen(true);
                          }
                        }}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" sideOffset={5}>
                    <Command>
                      <CommandList>
                        {isSearching ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : userSearchResults.length > 0 ? (
                          <CommandGroup heading="Kết quả tìm kiếm">
                            {userSearchResults.map((user) => (
                              <CommandItem
                                key={user.id}
                                onSelect={() => handleSelectUser(user)}
                                className="flex items-center gap-2 py-2"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.displayName}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                                {user.id.startsWith('suggestion_') && (
                                  <div className="ml-auto flex items-center">
                                    <span className="text-xs text-muted-foreground">Mời mới</span>
                                  </div>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : userSearchQuery.length > 1 ? (
                          <CommandEmpty>
                            <div className="flex flex-col items-center justify-center py-6">
                              <UserIcon className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Không tìm thấy người dùng</p>
                              {validateEmail(userSearchQuery) && (
                                <Button 
                                  variant="link" 
                                  className="mt-2"
                                  onClick={() => {
                                    handleSelectUser(createUserSuggestionFromEmail(userSearchQuery));
                                  }}
                                >
                                  Mời người dùng mới
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>
                        ) : null}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {emailError && (
                  <div className="text-xs text-destructive mt-1">{emailError}</div>
                )}
              </div>
                <Button 
                  onClick={handleAddMember} 
                  disabled={!newMemberEmail.trim() || isLoading}
                  className="flex-shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
                </Button>
              </div>
            </div>
            
            {/* Member list */}
            <div>
              <h3 className="text-sm font-medium mb-2">Danh sách thành viên ({filteredMembers.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(user.id)}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Xóa thành viên</span>
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {searchTerm ? "Không tìm thấy thành viên" : "Chưa có thành viên nào"}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Đóng
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Confirmation dialog for removing members */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thành viên này khỏi quỹ? Họ sẽ không còn quyền truy cập vào quỹ này nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
